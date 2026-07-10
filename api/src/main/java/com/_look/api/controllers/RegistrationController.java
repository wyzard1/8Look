package com._look.api.controllers;

import DTO.UserDTO;
import com._look.api.repositories.UserRepository;
import com._look.api.services.UserService;
import jakarta.validation.Valid;
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
    public void register(@Valid @RequestBody UserDTO dto) {
        service.registerNewUser(dto);

    }

}
