package com._look.api.DTO;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class UserUpdateDTO {

    private String username;

    private String current_password;

    private String email;

    private String password;

    private String phone_number;

}
