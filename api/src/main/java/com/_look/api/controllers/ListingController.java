package com._look.api.controllers;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;
import java.time.Instant;

import com._look.api.DTO.ListingUpdateDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com._look.api.entities.Listing;
import com._look.api.entities.User;
import com._look.api.repositories.UserRepository;
import com._look.api.service.ListingService;

import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/listings")
public class ListingController {

    private static final Pattern SEARCH_PATTERN = Pattern.compile("^[a-zA-Z0-9 \\-]{3,50}$");

    private final ListingService listingService;
    private final UserRepository userRepository;

    public ListingController(ListingService listingService, UserRepository userRepository) {
        this.listingService = listingService;
        this.userRepository = userRepository;
    }

    @PatchMapping(value = "/edit/{listingId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ListingDetailsResponse> editListing(@PathVariable Integer listingId,
                                                              @RequestPart("listing") ListingUpdateDTO dto,
                                                              @RequestPart(value = "files", required = false) List<MultipartFile> files,
                                                              Authentication authentication)
    {
        User authenticatedUser = getAuthenticatedUser(authentication);
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Listing updatedListing = listingService.editListing(
                listingId,
                Math.toIntExact(authenticatedUser.getId()),
                dto, files
            );
            return toListingDetailsResponse(updatedListing);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException ex) {
            if ("Listing not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Integer id)
    {
        try {
            listingService.deleteListing(id);
            return ResponseEntity.ok().build();
        } catch (NoSuchElementException ex) {
            return ResponseEntity.notFound().build();
        }
    }


    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Listing createListing(@RequestPart("listing") Listing listing,
                                 @RequestPart(value = "files", required = false) List<MultipartFile> files)
    {
        if (files == null || files.isEmpty() || files.stream().allMatch(MultipartFile::isEmpty)) {
            return listingService.createListing(listing);
        }

        return listingService.createListingWithImages(listing, files);
    }

    @GetMapping("/all")
    public List<Listing> getAllListings()
    {
        return listingService.getAllListings();
    }

    @GetMapping("/search")
    public List<Listing> searchListings(@RequestParam("query") @Size(max = 20, message = "Keyword must be 20 characters or less") String query)
    {
        if (!SEARCH_PATTERN.matcher(query).matches()) {
            throw new IllegalArgumentException("Invalid search query");
        }
        return listingService.searchListings(query);
    }

    @GetMapping("/{listingId}")
    public ResponseEntity<ListingDetailsResponse> getListingById(@PathVariable Integer listingId)
    {
        return listingService.getListingById(listingId)
            .map(this::toListingDetailsResponse)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{sellerId}")
    public ResponseEntity<UserListingsResponse> getAllListingsByUserId(@PathVariable Integer sellerId){
        return userRepository.findById(sellerId.longValue())
            .map(user -> ResponseEntity.ok(new UserListingsResponse(
                toSellerListingsResponse(user),
                listingService.getAllListingByUserId(sellerId)
            )))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private ResponseEntity<ListingDetailsResponse> toListingDetailsResponse(Listing listing) {
        SellerResponse seller = null;

        if (listing.getSellerId() != null) {
            seller = userRepository.findById(listing.getSellerId().longValue())
                .map(this::toSellerResponse)
                .orElse(null);
        }

        return ResponseEntity.ok(new ListingDetailsResponse(
            listing.getId(),
            listing.getTitle(),
            listing.getDescription(),
            listing.getPrice(),
            listing.getPlace(),
            listing.getCreatedAt(),
            listing.getUpdatedAt(),
            listing.getCategoryId(),
            listing.getImages(),
            listing.getSellerId(),
            listing.getViewCount(),
            seller
        ));
    }

    private SellerResponse toSellerResponse(User user) {
        return new SellerResponse(
            user.getId(),
            user.getUsername(),
            user.getAvatar_url(),
            user.getLast_login()
        );
    }

    private SellerListingsResponse toSellerListingsResponse(User user) {
        return new SellerListingsResponse(
            user.getId(),
            user.getUsername(),
            user.getAvatar_url(),
            user.getLast_login(),
            user.getPhone_number()
        );
    }

    private User getAuthenticatedUser(Authentication authentication)
    {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }

        return user;
    }

    public record ListingDetailsResponse(
        Integer id,
        String title,
        String description,
        Double price,
        String place,
        Instant createdAt,
        Instant updatedAt,
        Integer categoryId,
        List<String> images,
        Integer sellerId,
        Integer viewCount,
        SellerResponse seller
    ) {}

    public record SellerResponse(
        Long id,
        String username,
        String avatarUrl,
        Instant lastLogin
    ) {}

    public record SellerListingsResponse(
        Long id,
        String username,
        String avatarUrl,
        Instant lastLogin,
        String phoneNumber
    ) {}

    public record UserListingsResponse(
        SellerListingsResponse seller,
        List<Listing> listings
    ) {}
}
