package com._look.api.controllers;

import DTO.UserDTO;
import com._look.api.services.UserAlreadyExistException;
import com._look.api.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RegistrationController {

    private final UserService service;

    public RegistrationController(UserService s)
    {
        this.service = s;
    }

    @PostMapping({"/registration"})
    public ResponseEntity<Void> register(@Valid @RequestBody UserDTO dto) {
        service.registerNewUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @ExceptionHandler(UserAlreadyExistException.class)
    public ResponseEntity<Void> handleUserAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

}
