package com._look.api.controllers;

import com._look.api.DTO.UserDTO;
import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;
import com._look.api.repositories.UserRepository;
import com._look.api.service.UserAlreadyExistException;
import com._look.api.service.UserService;
import com._look.api.validation.AuthenticationRequest;
import com._look.api.validation.AuthenticationResponse;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.apache.tomcat.util.http.SameSiteCookies;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Calendar;
import java.util.Optional;

import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
public class UserController {

    private final UserService service;
    private final UserRepository userRepository;

    @Value("${spring.security.jwt.cookie.name}")
    private String cookieName;
    @Value("${spring.security.jwt.cookie.expires-in}")
    private int cookieExpireTime;


    public UserController(UserService s, UserRepository userRepository)
    {
        this.service = s;
        this.userRepository = userRepository;
    }

    @PostMapping({"/registration"})
    public ResponseEntity<Void> register(@Valid @RequestBody UserDTO dto) {
        service.registerNewUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/registrationConfirm")
    public ResponseEntity<Void> registrationConfirm(@RequestParam("token") String token)
    {
        VerificationToken verificationToken = service.getVerificationToken(token);

        if(verificationToken == null)
        {
            return new ResponseEntity<Void>(HttpStatus.CONFLICT);
        }

        User user = verificationToken.getUser();
        Calendar cal = Calendar.getInstance();

        if(verificationToken.getExpiryDate() == null ||
                (verificationToken.getExpiryDate().getTime() - cal.getTime().getTime()) <= 0)
        {
            return new ResponseEntity<>(HttpStatus.REQUEST_TIMEOUT);
        }

        user.setIs_verified(true);
        userRepository.save(user);
        service.deleteToken(verificationToken);
        return new ResponseEntity<Void>(HttpStatus.OK);
    }

    @GetMapping("/fetchUser")
    public ResponseEntity<Optional<User>> fetchUser(Authentication authentication) {
        Optional<User> u = userRepository.findByUsername(authentication.getName());
        
        u.ifPresent(user -> 
            {
                user.setLast_login(Instant.now());
                userRepository.save(user);
            });

        return ResponseEntity.ok(u);
    }
    

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> logOn (@RequestBody AuthenticationRequest request, HttpServletResponse response)
    {
        var authTokenResponse = service.authenticate(request);
        String token = authTokenResponse.getToken();

        

        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
        .httpOnly(true)
        .secure(true)
        .path("/")
        .sameSite(SameSiteCookies.STRICT.toString())
        .maxAge(cookieExpireTime)
        .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(authTokenResponse);
    }

    @ExceptionHandler(UserAlreadyExistException.class)
    public ResponseEntity<Void> handleUserAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

}
