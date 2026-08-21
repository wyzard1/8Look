package com._look.api.DTO;


import com._look.api.entities.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;


public class UserMeDTO {

    public UserMeDTO()
    {
    }

    public UserMeDTO(User u)
    {
        this.id = u.getId();
        this.email = u.getEmail();
        this.avatar_url = u.getAvatar_url();
        this.username = u.getUsername();
        this.is_verified = u.getIs_verified();
        this.last_login = u.getLast_login();
    }

    @NotEmpty
    private String username;

    private String email;

    private String avatar_url;

    private long id;

    private Instant last_login;

    @JsonProperty("is_verified")
    private Boolean is_verified;

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

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Instant getLast_login() {
        return last_login;
    }

    public void setLast_login(Instant last_login) {
        this.last_login = last_login;
    }

    public Boolean getIs_verified() {
        return is_verified;
    }

    public void setIs_verified(Boolean is_verified) {
        this.is_verified = is_verified;
    }
}
