package com._look.api.service;

import com._look.api.DTO.UserDTO;
import com._look.api.DTO.UserMeDTO;
import com._look.api.DTO.UserUpdateDTO;
import com._look.api.DTO.PasswordResetResultDTO;
import com._look.api.entities.Role;
import com._look.api.entities.Status;
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
import java.util.function.Consumer;

import static java.util.concurrent.TimeUnit.MINUTES;


@Transactional
@Service
public class UserService implements IUserService {
    private static final String REGISTRATION_TOKEN_PURPOSE = "REGISTRATION";
    private static final String PASSWORD_RESET_TOKEN_PURPOSE = "PASSWORD_RESET";

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final ListingService listings;
    private final VerificationTokenRepository tokenRepository;
    private final JwtService jwtService;

    @Value("${spring.minio.endpoint}")
    private String minioEndpoint;
    @Value("${spring.minio.public-endpoint}")
    private String publicMinioEndpoint;
    @Value("${spring.minio.user_bucket}")
    private String bucket;
    @Value("${spring.mail.username}")
    private String mailUsername;

    @Autowired
    private MinioClient minioClient;

    private final JavaMailSender mailSender;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder, ListingService listings,
                       VerificationTokenRepository tokenRepository, JwtService jwtService, JavaMailSender mailSender, MessageSource messages, AuthenticationManager authenticationManager) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.listings = listings;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }

    public void disconnect(User user)
    {
        var storedUser = repository.findById(user.getId()).orElse(null);
        if(storedUser != null) {
            user.setStatus(Status.OFFLINE);
            repository.save(user);
        }
    }

    public void setUserOnline(User user)
    {
        user.setStatus(Status.ONLINE);
        repository.save(user);
    }

    public List<User> findConnectedUsers(){
        return repository.findAllByStatus(Status.ONLINE);
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
        VerificationToken v = new VerificationToken(token, user, REGISTRATION_TOKEN_PURPOSE);
        tokenRepository.save(v);
    }

    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        Optional<User> user = repository.findByEmail(email.trim());
        if (user.isEmpty()) {
            return;
        }

        tokenRepository.deleteByUserAndPurpose(user.get(), PASSWORD_RESET_TOKEN_PURPOSE);

        String token = UUID.randomUUID().toString();
        VerificationToken resetToken = new VerificationToken(token, user.get(), PASSWORD_RESET_TOKEN_PURPOSE);
        tokenRepository.saveAndFlush(resetToken);

        String resetURL = buildFrontendUrl("/auth/reset-password?token="+token);

        SimpleMailMessage resetEmail = new SimpleMailMessage();
        resetEmail.setSubject("8look password reset");
        resetEmail.setFrom(mailUsername);
        resetEmail.setTo(user.get().getEmail());
        resetEmail.setText("""
                         We received a request to reset your 8look password.
                         If this was you, open this link to set a new password:
                         """ + "\r\n" + resetURL + "\r\n\r\nThis link expires in 24 hours.");
        mailSender.send(resetEmail);
    }

    public PasswordResetResultDTO resetPassword(String token, String password) {
        if (token == null || token.isBlank() || password == null || password.length() < 8) {
            return new PasswordResetResultDTO("INVALID_INPUT", "Reset token is missing or password is too short.");
        }

        String cleanToken = token.trim();
        VerificationToken resetToken = tokenRepository.findByTokenAndPurpose(cleanToken, PASSWORD_RESET_TOKEN_PURPOSE);
        if (resetToken == null) {
            VerificationToken anyToken = tokenRepository.findByToken(cleanToken);
            if (anyToken != null) {
                return new PasswordResetResultDTO("WRONG_TOKEN_PURPOSE", "This link is not a password reset link.");
            }
            return new PasswordResetResultDTO("TOKEN_NOT_FOUND", "This reset link was not found. Request a new password reset link.");
        }

        Date now = Date.from(Instant.now());
        if (resetToken.getExpiryDate() == null || !resetToken.getExpiryDate().after(now)) {
            tokenRepository.delete(resetToken);
            return new PasswordResetResultDTO("TOKEN_EXPIRED", "This reset link has expired. Request a new password reset link.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        user.setUpdated_at(Instant.now());
        repository.save(user);
        tokenRepository.delete(resetToken);
        return new PasswordResetResultDTO("OK", "Password reset.");
    }

    @Scheduled(fixedRate = 60, timeUnit = MINUTES)
    public void deleteExpired()
    {
        Date now = Date.from(Instant.now());
        List<VerificationToken> l = tokenRepository.findByExpiryDateLessThan(now);
        for(VerificationToken v : l)
        {
            if (REGISTRATION_TOKEN_PURPOSE.equals(v.getPurpose()) && v.getUser().isEnabled() == false) {
                repository.delete(v.getUser());
            }
        }
        tokenRepository.deleteByExpiryDateLessThan(now);

    }

    public void deleteUser(Long userId)
    {
        User user = repository.findById(userId).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        listings.deleteAllUserListings(user.getId());
        repository.delete(user);
    }

    @Override
    public VerificationToken getVerificationToken(String token) {
        return tokenRepository.findByToken(token);
    }


    public UserMeDTO updateUser(Long id, UserUpdateDTO dto){
        User user = repository.findById(id).orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if((!passwordEncoder.matches(dto.getCurrent_password(), user.getPassword())) || dto.getCurrent_password() == null || dto.getCurrent_password().isBlank())
        {
            return null;
        }

        updateIfPresent(dto.getUsername(), user::setUsername);
        updateIfPresent(dto.getEmail(), user::setEmail);
        updateIfPresent(dto.getPassword(), password -> user.setPassword(passwordEncoder.encode(password)));
        updateIfPresent(dto.getPhone_number(), user::setPhone_number);

        user.setUpdated_at(Instant.now());

        return new UserMeDTO(repository.save(user));
    }

    private void confirmRegistration (User user)
    {
        String token = UUID.randomUUID().toString();
        createVerificationToken(user, token);

        String verifyURL = buildFrontendUrl("/auth/confirmRegistration?token="+token);
        String recipientAdress = user.getEmail();
        String subject = "8look Registration confirmation";
        String message = """
                         Your 8look confirmation url is here.\r
                         Your account will be deleted unless verified""";

        SimpleMailMessage email = new SimpleMailMessage();
        email.setSubject(subject);
        email.setFrom(mailUsername);
        email.setTo(recipientAdress);
        email.setText(message + "\r\n" + verifyURL);
        mailSender.send(email);
    }

    public void updateAvatar(Long userId, MultipartFile file)
    {
        User user = repository.findById(userId).orElseThrow(() -> new UsernameNotFoundException("User not found"));

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

    private void updateIfPresent(String value, Consumer<String> setter)
    {
        if(value != null && !value.isBlank())
        {
            setter.accept(value);
        }
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

    private String buildFrontendUrl(String path)
    {
        String host = Optional.ofNullable(System.getenv("APP_HOST"))
                .filter(value -> !value.isBlank())
                .orElse("localhost");
        String port = Optional.ofNullable(System.getenv("APP_PORT"))
                .filter(value -> !value.isBlank())
                .orElse("3000");

        return "http://" + host + ":" + port + path;
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
