package com._look.api.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetConfirmDTO {

    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 8)
    private String password;
}
