package com._look.api.DTO;

import com._look.api.validation.ValidEmail;
import jakarta.validation.constraints.NotEmpty;


public class UserDTO {

    @NotEmpty
    private String username;

    @ValidEmail
    @NotEmpty
    private String email;

    @NotEmpty
    private String password;

    @NotEmpty
    private String phone_number;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone_number() {
        return phone_number;
    }

    public void setPhone_number(String phone_number) {
        this.phone_number = phone_number;
    }


}
