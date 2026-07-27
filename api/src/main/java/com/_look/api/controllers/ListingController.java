package com._look.api.controllers;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com._look.api.entities.Listing;
import com._look.api.service.ListingService;

import jakarta.validation.constraints.Size;

import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/listings")
public class ListingController {

    private static final Pattern SEARCH_PATTERN = Pattern.compile("^[a-zA-Z0-9 \\-]{3,50}$");

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @PostMapping("/create")
    public Listing createListing(@RequestBody Listing listing) {
        return listingService.createListing(listing);
    }

    @GetMapping("/all")
    public List<Listing> getAllListings() {
        // Logic to retrieve all listings
        return listingService.getAllListings();
    }

    @GetMapping("/search")
    public List<Listing> searchListings(@RequestParam("query") @Size(max = 20, message = "Keyword must be 20 characters or less") String query) {
        if (!SEARCH_PATTERN.matcher(query).matches()) {
            throw new IllegalArgumentException("Invalid search query");
        }
        return listingService.searchListings(query);
    }

    @GetMapping("/{listingId}")
    public ResponseEntity<Listing> getListingById(@PathVariable Integer listingId) {
        return listingService.getListingById(listingId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
