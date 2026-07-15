package com._look.api.services;

import com._look.api.DTO.UserDTO;
import com._look.api.entities.Role;
import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;
import com._look.api.repositories.UserRepository;
import com._look.api.repositories.VerificationTokenRepository;
import jakarta.transaction.Transactional;

import org.springframework.context.MessageSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static java.util.concurrent.TimeUnit.MINUTES;


@Transactional
@Service
public class UserService implements IUserService{

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository tokenRepository;


    private final JavaMailSender mailSender;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder,
         VerificationTokenRepository tokenRepository, JavaMailSender mailSender, MessageSource messages) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
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
    public User registerNewUserAccount(UserDTO userDto) throws UserAlreadyExistException {
        return null;
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
         if(v.getUser().getIs_verified() == false);
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
        +"/"+"registrationConfirm?token="+token;
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

    public void deleteToken(VerificationToken t){
        tokenRepository.delete(t);
    }

    private boolean emailExists(String email) {
        return repository.findByEmail(email) != null;
    }
    
    private boolean usernameExists(String username) {
        return repository.findByUsername(username) != null;
    }
}
