package com._look.api.DTO;


import jakarta.validation.constraints.NotEmpty;


public class UserMeDTO {

    @NotEmpty
    private String username;

    private String email;

    private String avatar_url;

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

    public String getAvatarUrl() {
        return avatar_url;
    }

    public void setAvatarUrl(String avatar_url) {
        this.avatar_url = avatar_url;
    }


}
