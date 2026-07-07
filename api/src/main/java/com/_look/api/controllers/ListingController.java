package com._look.api.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com._look.api.entities.Listing;

@RestController
@RequestMapping("/listings")
public class ListingController {

    Listing listing;
    List<Listing> listings;

    @GetMapping("/{vendorId}")
    public Listing getListingByVendorId(Integer vendorId) {
        // Logic to retrieve the listing by vendorId
        return listing;
    }

    

    @GetMapping("/all")
    public List<Listing> getAllListings() {
        // Logic to retrieve all listings
        return listings;
    }

}
