package com._look.api.service;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com._look.api.entities.Listing;
import com._look.api.repositories.ListingRepository;
import com._look.api.search.ListingSpecification;
import org.springframework.web.multipart.MultipartFile;


@Service
public class ListingService {
    private final ListingRepository listingRepository;

    @Value("${spring.minio.endpoint}")
    private String minioEndpoint;

    @Value("${spring.minio.public-endpoint}")
    private String publicMinioEndpoint;

    @Value("${spring.minio.listing_bucket}")
    private String bucket;

    @Autowired
    private MinioClient minioClient;

    public ListingService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    public Optional<Listing> getListingById(Integer listingId) {
        return listingRepository.findById(listingId)
            .map(listing -> {
                listing.increaseViewCount();
                return listingRepository.save(listing);
            });
    }

    public void deleteAllUserListings(long sellerId)
    {
        for(Listing l : listingRepository.findAllBySellerId(Math.toIntExact(sellerId)))
        {
            listingRepository.delete(l);
        }
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public List<Listing> getAllListingByUserId(Integer sellerId){return listingRepository.findAllBySellerId(sellerId);}

    public Listing createListing(Listing listing) {
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        return listingRepository.save(listing);
    }

    public Listing createListingWithImages(Listing listing, List<MultipartFile> files) {
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        Listing savedListing = listingRepository.save(listing);

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            try {
                String filename = sanitizeFilename(file.getOriginalFilename());
                String location = savedListing.getId() + "/" + UUID.randomUUID() + "-" + filename;
                PutObjectArgs args = PutObjectArgs.builder().bucket(bucket).object(location)
                        .stream(file.getInputStream(), file.getSize(), (long) -1).contentType(file.getContentType())
                        .build();
                minioClient.putObject(args);
                savedListing.addImageUrl(buildImageAccessUrl(location));
            }
            catch (Exception e)
            {
                throw new IllegalStateException("Could not upload listing image", e);
            }
        }

        return listingRepository.save(savedListing);
    }


    public List<Listing> searchListings(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        try {
            Integer listingId = Integer.parseInt(keyword.trim());
            return listingRepository.findById(listingId)
                .map(List::of)
                .orElseGet(List::of);
        } catch (NumberFormatException ex) {
            Specification<Listing> spec = ListingSpecification.searchByKeyword(keyword);
            return listingRepository.findAll(spec);
        }
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "file";
        }

        String filename = originalFilename.replace("\\", "/");
        int lastSlashIndex = filename.lastIndexOf("/");
        if (lastSlashIndex >= 0) {
            filename = filename.substring(lastSlashIndex + 1);
        }

        filename = Normalizer.normalize(filename, Normalizer.Form.NFKD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9._-]", "-")
            .replaceAll("-{2,}", "-")
            .replaceAll("^[._-]+|[._-]+$", "");

        return filename.isBlank() ? "file" : filename;
    }

    private String buildImageAccessUrl(String location) {
        return publicMinioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/" + location;
    }
}
