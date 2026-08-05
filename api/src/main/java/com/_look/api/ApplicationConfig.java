package com._look.api;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Value("${spring.minio.endpoint}")
    private String minioEndpoint;

    @Value("${spring.minio.access_key}")
    private String minioAccessKey;

    @Value("${spring.minio.secret_key}")
    private String minioSecretKey;



    @Bean
    public MinioClient minioClient(){
        return MinioClient.builder().endpoint(minioEndpoint
        ).credentials(minioAccessKey, minioSecretKey).build();
    }
}
