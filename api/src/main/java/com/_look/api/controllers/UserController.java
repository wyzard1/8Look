package com._look.api.controllers;

import com._look.api.DTO.UserDTO;
import com._look.api.entities.User;
import com._look.api.entities.VerificationToken;
import com._look.api.repositories.UserRepository;
import com._look.api.services.UserAlreadyExistException;
import com._look.api.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Calendar;

@RestController
public class UserController {

    private final UserService service;
    private final UserRepository userRepository;


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

    @ExceptionHandler(UserAlreadyExistException.class)
    public ResponseEntity<Void> handleUserAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

}
