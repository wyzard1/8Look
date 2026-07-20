package com._look.api.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com._look.api.entities.Listing;
import com._look.api.repositories.ListingRepository;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private ListingService listingService;

    @Test
    void searchListingsShouldResolveNumericQueryAsListingId() {
        Listing listing = mock(Listing.class);
        when(listingRepository.findById(42)).thenReturn(Optional.of(listing));

        List<Listing> results = listingService.searchListings("42");

        assertEquals(1, results.size());
        assertSame(listing, results.get(0));
        verify(listingRepository).findById(42);
    }
}
