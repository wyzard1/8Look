package com._look.api.controllers;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import com._look.api.entities.Listing;
import com._look.api.service.ListingService;

import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/listings")
public class ListingController {

    private static final Pattern SEARCH_PATTERN = Pattern.compile("^[a-zA-Z0-9 \\-]{3,50}$");

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
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
        // Logic to retrieve all listings
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
    public ResponseEntity<Listing> getListingById(@PathVariable Integer listingId)
    {
        return listingService.getListingById(listingId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
