package com._look.api.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com._look.api.entities.Listing;
import com._look.api.services.ListingService;

import jakarta.validation.constraints.Size;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/listings")
public class ListingController {

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
        return listingService.searchListings(query);
    }

    @GetMapping("/{vendorId}")
    public Optional<Listing> getListingByVendorId(@PathVariable Integer vendorId) {
        
        return listingService.getListingByVendorId(vendorId);
    }
}
