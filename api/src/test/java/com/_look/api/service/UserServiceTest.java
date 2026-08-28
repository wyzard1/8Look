package com._look.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Calendar;
import java.util.Optional;

import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;
import com._look.api.DTO.PasswordResetResultDTO;
import com._look.api.repositories.UserRepository;
import com._look.api.repositories.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ListingService listingService;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MessageSource messageSource;

    @Mock
    private AuthenticationManager authenticationManager;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
            userRepository,
            passwordEncoder,
            listingService,
            tokenRepository,
            jwtService,
            mailSender,
            messageSource,
            authenticationManager
        );
        ReflectionTestUtils.setField(userService, "mailUsername", "sender@example.com");
    }

    @Test
    void requestPasswordResetShouldCreateTokenAndSendEmailWhenUserExists() {
        User user = new User();
        user.setEmail("person@example.com");

        when(userRepository.findByEmail("person@example.com")).thenReturn(Optional.of(user));

        userService.requestPasswordReset("person@example.com");

        ArgumentCaptor<VerificationToken> tokenCaptor = ArgumentCaptor.forClass(VerificationToken.class);
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);

        verify(tokenRepository).deleteByUserAndPurpose(user, "PASSWORD_RESET");
        verify(tokenRepository).saveAndFlush(tokenCaptor.capture());
        verify(mailSender).send(messageCaptor.capture());

        assertTrue(tokenCaptor.getValue().getToken().length() > 0);
        assertTrue(messageCaptor.getValue().getText().contains("/auth/reset-password?token="));
    }

    @Test
    void requestPasswordResetShouldNotSendEmailWhenUserDoesNotExist() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        userService.requestPasswordReset("missing@example.com");

        verify(tokenRepository, never()).save(any(VerificationToken.class));
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void resetPasswordShouldUpdatePasswordAndDeleteValidToken() {
        User user = new User();
        VerificationToken resetToken = new VerificationToken("reset-token", user, "PASSWORD_RESET");
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR, 1);
        resetToken.setExpiryDate(calendar.getTime());

        when(tokenRepository.findByTokenAndPurpose("reset-token", "PASSWORD_RESET")).thenReturn(resetToken);
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-password");

        PasswordResetResultDTO reset = userService.resetPassword("reset-token", "new-password");

        assertEquals("OK", reset.status());
        verify(passwordEncoder).encode("new-password");
        verify(userRepository).save(user);
        verify(tokenRepository).delete(resetToken);
    }

    @Test
    void resetPasswordShouldRejectRegistrationToken() {
        User user = new User();
        VerificationToken registrationToken = new VerificationToken("registration-token", user, "REGISTRATION");

        when(tokenRepository.findByTokenAndPurpose("registration-token", "PASSWORD_RESET")).thenReturn(null);

        when(tokenRepository.findByToken("registration-token")).thenReturn(registrationToken);

        PasswordResetResultDTO reset = userService.resetPassword("registration-token", "new-password");

        assertEquals("WRONG_TOKEN_PURPOSE", reset.status());
        verify(passwordEncoder, never()).encode(contains("new-password"));
        verify(userRepository, never()).save(any(User.class));
    }
}
