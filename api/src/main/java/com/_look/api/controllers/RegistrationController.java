package com._look.api.controllers;

import DTO.UserDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class RegistrationController {

    @GetMapping("/registration")
    public UserDTO getRegistrationData()
    {
        return new UserDTO();
    }

}
