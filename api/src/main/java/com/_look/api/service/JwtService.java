package com._look.api.service;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com._look.api.entities.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${spring.security.jwt.key}")
    private String key;

    public Long extractUserId(String jwt)
    {
        return Long.valueOf(extractClaim(jwt, Claims::getSubject));
    }

    public String generateToken(UserDetails userDetails)
    {
        return generateToken(new HashMap<>(), userDetails);
    }

    public boolean isTokenValid(String token, UserDetails userDetails)
    {
        final Long userId = extractUserId(token);

        return userDetails instanceof User user
                && userId.equals(user.getId())
                && !isTokenExipred(token);
    }

    private boolean isTokenExipred(String token)
    {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails
    )
    {
        if (!(userDetails instanceof User user) || user.getId() == null) {
            throw new IllegalArgumentException("JWT token subject requires a persisted user id");
        }

        return Jwts.builder()
                .claims(extraClaims)
                .subject(user.getId().toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000*24*60))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact() ;
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver)
    {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String jwt)
    {
        return Jwts.parser().setSigningKey(getSignInKey()).build().parseSignedClaims(jwt).getPayload();
    }

    private Key getSignInKey(){
        byte[] keyBytes = Decoders.BASE64.decode(key);
        return Keys.hmacShaKeyFor(keyBytes);
    }

}
