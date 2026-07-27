package com._look.api.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com._look.api.entities.Listing;
import com._look.api.repositories.ListingRepository;
import com._look.api.search.ListingSpecification;


@Service
public class ListingService {
    private final ListingRepository listingRepository;

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

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public Listing createListing(Listing listing) {
        listing.setCreatedAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        return listingRepository.save(listing);
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
}
