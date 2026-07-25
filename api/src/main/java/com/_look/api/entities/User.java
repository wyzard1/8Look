package com._look.api.entities;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String username;
    @Column(nullable = false)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false)
    private String phone_number;
    private String avatar_url;
    private Boolean is_verified;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;
    private Instant created_at;
    private Instant updated_at;
    private Instant last_login;

    public User(){
        super();
        this.is_verified=false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Collection<? extends  GrantedAuthority> getAuthorities(){
       return List.of(new SimpleGrantedAuthority(role.name()));
    }

    public Instant getLast_login() {
        return last_login;
    }

    public void setLast_login(Instant last_login) {
        this.last_login = last_login;
    }

    public Instant getUpdated_at() {
        return updated_at;
    }

    public void setUpdated_at(Instant updated_at) {
        this.updated_at = updated_at;
    }

    public Instant getCreated_at() {
        return created_at;
    }

    public void setCreated_at(Instant created_at) {
        this.created_at = created_at;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Role getRole() {
        return role;
    }

    public void setIs_verified(Boolean is_verified) {
        this.is_verified = is_verified;
    }

    public String getAvatar_url() {
        return avatar_url;
    }

    public void setAvatar_url(String avatar_url) {
        this.avatar_url = avatar_url;
    }

    public String getPhone_number() {
        return phone_number;
    }

    public void setPhone_number(String phone_number) {
        this.phone_number = phone_number;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password_hash) {
        this.password = password_hash;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return is_verified;
    }

    public void setUsername(String username) {
        this.username = username;
    }


}
