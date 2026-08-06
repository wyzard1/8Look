package com._look.api.controllers;

import com._look.api.DTO.UserDTO;
import com._look.api.DTO.UserMeDTO;
import com._look.api.entities.Listing;
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
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Calendar;
import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;


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
    public ResponseEntity<Void> register(@Valid @RequestBody UserDTO dto)
    {
        service.registerNewUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping(value = "/updateAvatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> updateAvatar(Authentication authentication,
                                             @RequestPart(value = "file", required = true) MultipartFile file)
    {
        if (file == null || file.isEmpty())
        {
            return ResponseEntity.badRequest().build();
        }

        service.updateAvatar(authentication.getName(), file);
        return ResponseEntity.ok().build();
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

    @GetMapping("/me")
    public ResponseEntity<UserMeDTO> fetchUser(Authentication authentication) {

        Optional<User> u = userRepository.findByUsername(authentication.getName());
        System.out.println(authentication.getName());
        if(u.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        User user = u.get();
        user.setLast_login(Instant.now());

        UserMeDTO dto = new UserMeDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        dto.setAvatarUrl(user.getAvatar_url());
        dto.setLast_login(user.getLast_login());


        userRepository.save(user);

        return ResponseEntity.ok(dto);
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
