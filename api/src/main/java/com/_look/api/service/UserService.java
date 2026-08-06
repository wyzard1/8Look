package com._look.api.service;

import com._look.api.DTO.UserDTO;
import com._look.api.entities.Role;
import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;
import com._look.api.repositories.UserRepository;
import com._look.api.repositories.VerificationTokenRepository;
import com._look.api.validation.AuthenticationRequest;
import com._look.api.validation.AuthenticationResponse;
import io.minio.*;
import io.minio.errors.ErrorResponseException;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.Instant;
import java.util.*;

import static java.util.concurrent.TimeUnit.MINUTES;


@Transactional
@Service
public class UserService implements IUserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository tokenRepository;
    private final JwtService jwtService;

    @Value("${spring.minio.endpoint}")
    private String minioEndpoint;
    @Value("${spring.minio.public-endpoint}")
    private String publicMinioEndpoint;
    @Value("${spring.minio.user_bucket}")
    private String bucket;

    @Autowired
    private MinioClient minioClient;

    private final JavaMailSender mailSender;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder,
                       VerificationTokenRepository tokenRepository, JwtService jwtService, JavaMailSender mailSender, MessageSource messages, AuthenticationManager authenticationManager) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }

    @Override
    public User registerNewUser(UserDTO dto) throws UserAlreadyExistException{
        if(emailExists(dto.getEmail()) || usernameExists(dto.getUsername()))
        {
            throw new UserAlreadyExistException("User with that email or username already exists");
        }

        User u = new User();
        u.setUsername(dto.getUsername());
        u.setEmail(dto.getEmail());
        u.setPassword(encodePassword(dto.getPassword()));
        u.setPhone_number(dto.getPhone_number());
        u.setRole(Role.USER);
        u.setCreated_at(Instant.now());
        u.setUpdated_at(Instant.now());

        repository.save(u);
        confirmRegistration(u);

        return u;
    }

    @Override
    public User getUser(String verificationToken) {
        User u = tokenRepository.findByToken(verificationToken).getUser();
        return u;
    }

    @Override
    public void saveRegisteredUser(User user) {
        repository.save(user);
    }

    @Override
    public void createVerificationToken(User user, String token) {
        VerificationToken v = new VerificationToken(token, user);
        tokenRepository.save(v);
    }

    @Scheduled(fixedRate = 60, timeUnit = MINUTES)
    public void deleteExpired()
    {
        Date now = Date.from(Instant.now());
        List<VerificationToken> l = tokenRepository.findByExpiryDateLessThan(now);
        for(VerificationToken v : l)
        {
         if(v.getUser().isEnabled() == false);
         {
            repository.delete(v.getUser());
         }
        }
        tokenRepository.deleteByExpiryDateLessThan(now);

    }


    @Override
    public VerificationToken getVerificationToken(String token) {
        return tokenRepository.findByToken(token);
    }

    private void confirmRegistration (User user)
    {
        String token = UUID.randomUUID().toString();
        createVerificationToken(user, token);

        String verifyURL = "http://"+System.getenv("APP_HOST")+":"+System.getenv("APP_PORT")
        +"/"+"auth/confirmRegistration?token="+token;
        String recipientAdress = user.getEmail();
        String subject = "8look Registration confirmation";
        String message = """
                         Your 8look confirmation url is here.\r
                         Your account will be deleted unless verified""";

        SimpleMailMessage email = new SimpleMailMessage();
        email.setSubject(subject);
        email.setTo(recipientAdress);
        email.setText(message + "\r\n" + verifyURL);
        mailSender.send(email);
    }

    public void updateAvatar(String name, MultipartFile file)
    {
        User user = repository.findByUsername(name).orElseThrow(() -> new UsernameNotFoundException(name));

        try {

            String oldLocation = extractObjectLocation(user.getAvatar_url());
            String filename = sanitizeFilename(file.getOriginalFilename());
            String location = user.getId() + "/" + UUID.randomUUID() + "-" + filename;

            PutObjectArgs args = PutObjectArgs.builder().bucket(bucket).object(location)
                    .stream(file.getInputStream(), file.getSize(), (long) -1).contentType(file.getContentType())
                    .build();
            minioClient.putObject(args);
            user.setAvatar_url(buildImageAccessUrl(location));

            if(oldLocation != null && objectExists(oldLocation)){
                minioClient.removeObject(RemoveObjectArgs.builder()
                        .bucket(bucket).object(oldLocation).build());
            }
        }
        catch (Exception e)
        {
            throw new IllegalStateException("Could not upload user avatar", e);
        }

        repository.save(user);
    }

    public void deleteToken(VerificationToken t){
        tokenRepository.delete(t);
    }

    private boolean emailExists(String email) {
        return repository.findByEmail(email).isPresent();
    }
    
    private boolean usernameExists(String username) {
        return repository.findByUsername(username).isPresent();
    }

    private String extractObjectLocation(String avatarUrl)
    {
        if(avatarUrl == null || avatarUrl.isBlank())
        {
            return null;
        }

        String prefix = publicMinioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/";

        if(!avatarUrl.startsWith(prefix))
        {
            String internalPrefix = minioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/";
            if(!avatarUrl.startsWith(internalPrefix))
            {
                return null;
            }
            return avatarUrl.substring(internalPrefix.length());
        }

        return avatarUrl.substring(prefix.length());
    }

    private boolean objectExists(String location) throws Exception
    {
        try
        {
            minioClient.statObject(StatObjectArgs.builder()
                    .bucket(bucket).object(location).build());
            return true;
        }
        catch (ErrorResponseException e)
        {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return false;
            }
            throw e;
        }
    }

    private String buildImageAccessUrl(String location)
    {
        return publicMinioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/" + location;
    }

    private String sanitizeFilename(String originalFilename)
    {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "file";
        }

        String filename = originalFilename.replace("\\", "/");
        int lastSlashIndex = filename.lastIndexOf("/");
        if (lastSlashIndex >= 0) {
            filename = filename.substring(lastSlashIndex + 1);
        }

        filename = Normalizer.normalize(filename, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^[._-]+|[._-]+$", "");

        return filename.isBlank() ? "file" : filename;
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request)
    {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = repository.findByEmail(request.getEmail()).orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return new AuthenticationResponse(jwtToken);
    }
}
