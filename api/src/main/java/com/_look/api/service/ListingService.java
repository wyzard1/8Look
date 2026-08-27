package com._look.api.service;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com._look.api.DTO.ListingUpdateDTO;
import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectsArgs;
import io.minio.Result;
import io.minio.messages.DeleteRequest;
import io.minio.messages.DeleteResult;
import io.minio.messages.Item;
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

    public void deleteAllUserListings(long sellerId) {
        for (Listing l : listingRepository.findAllBySellerId(Math.toIntExact(sellerId))) {
            deleteListingImages(l.getId());
            listingRepository.delete(l);
        }

    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public List<Listing> getAllListingByUserId(Integer sellerId) {
        return listingRepository.findAllBySellerId(sellerId);
    }

    public Listing createListing(Listing listing) {
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        return listingRepository.save(listing);
    }

    public void deleteListing(Integer listingId){
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new NoSuchElementException("Listing not found"));

        deleteListingImages(listingId);
        listingRepository.delete(listing);
    }

    public Listing editListing(Integer listingId, Integer sellerId, ListingUpdateDTO dto, List<MultipartFile> files) {
        if (dto == null) {
            throw new IllegalArgumentException("Listing update data is required");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        if (sellerId != null && !sellerId.equals(listing.getSellerId())) {
            throw new SecurityException("Only the listing owner can edit this listing");
        }

        if (dto.getTitle() != null) {
            if (dto.getTitle().isBlank()) {
                throw new IllegalArgumentException("Title cannot be blank");
            }
            listing.setTitle(dto.getTitle().trim());
        }

        if (dto.getPrice() != null) {
            if (dto.getPrice() <= 0) {
                throw new IllegalArgumentException("Price must be greater than 0");
            }
            listing.setPrice(dto.getPrice());
        }

        if (dto.getDescription() != null) {
            listing.setDescription(dto.getDescription().trim());
        }

        if (dto.getPlace() != null) {
            if (dto.getPlace().isBlank()) {
                throw new IllegalArgumentException("Place cannot be blank");
            }
            listing.setPlace(dto.getPlace().trim());
        }

        if (dto.getImage_urls() != null) {
            deleteListingImagesNotInUrlList(listing.getId(), dto.getImage_urls());
            listing.setImage_urls(new ArrayList<>(dto.getImage_urls()));
        }

        if (files != null) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue;
                }

                try {
                    String filename = sanitizeFilename(file.getOriginalFilename());
                    String location = listing.getId() + "/" + UUID.randomUUID() + "-" + filename;

                    PutObjectArgs args = PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(location)
                            .stream(file.getInputStream(), file.getSize(), (long) -1)
                            .contentType(file.getContentType())
                            .build();

                    minioClient.putObject(args);
                    listing.addImageUrl(buildImageAccessUrl(location));
                } catch (Exception e) {
                    throw new IllegalStateException("Could not upload listing image", e);
                }
            }
        }
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

    private void deleteListingImages(Integer listingId) {
        try {
            deleteListingImageObjects(listListingImageObjects(listingId));
        } catch (Exception e) {
            throw new IllegalStateException("Could not delete listing images", e);
        }
    }

    private void deleteListingImagesNotInUrlList(Integer listingId, List<String> imageUrls) {
        try {
            String listingPrefix = listingId + "/";
            Set<String> retainedObjects = new HashSet<>();

            for (String imageUrl : imageUrls) {
                String objectName = extractListingObjectName(imageUrl);
                if (objectName != null && objectName.startsWith(listingPrefix)) {
                    retainedObjects.add(objectName);
                }
            }

            List<String> objectsToDelete = listListingImageObjects(listingId).stream()
                    .filter(objectName -> !retainedObjects.contains(objectName))
                    .toList();

            deleteListingImageObjects(objectsToDelete);
        } catch (Exception e) {
            throw new IllegalStateException("Could not delete removed listing images", e);
        }
    }

    private List<String> listListingImageObjects(Integer listingId) throws Exception {
        List<String> objectNames = new ArrayList<>();
        Iterable<Result<Item>> results = minioClient.listObjects(ListObjectsArgs.builder()
                .bucket(bucket)
                .prefix(listingId + "/")
                .recursive(true)
                .build());

        for (Result<Item> result : results) {
            objectNames.add(result.get().objectName());
        }

        return objectNames;
    }

    private void deleteListingImageObjects(List<String> objectNames) throws Exception {
        if (objectNames.isEmpty()) {
            return;
        }

        List<DeleteRequest.Object> objects = objectNames.stream()
                .map(DeleteRequest.Object::new)
                .toList();

        Iterable<Result<DeleteResult.Error>> deleteResults = minioClient.removeObjects(
                RemoveObjectsArgs.builder().bucket(bucket).objects(objects).build());

        for (Result<DeleteResult.Error> result : deleteResults) {
            DeleteResult.Error error = result.get();
            throw new IllegalStateException("Could not delete object " + error.objectName() + ": " + error.message());
        }
    }

    private String extractListingObjectName(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        String normalizedUrl = imageUrl.trim().replaceAll("[?#].*$", "");
        String publicPrefix = publicMinioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/";
        if (normalizedUrl.startsWith(publicPrefix)) {
            return normalizedUrl.substring(publicPrefix.length());
        }

        String internalPrefix = minioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/";
        if (normalizedUrl.startsWith(internalPrefix)) {
            return normalizedUrl.substring(internalPrefix.length());
        }

        return normalizedUrl;
    }

    private String buildImageAccessUrl(String location) {
        return publicMinioEndpoint.replaceAll("/+$", "") + "/" + bucket + "/" + location;
    }
}
