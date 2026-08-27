package com._look.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.StreamSupport;

import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectsArgs;
import io.minio.Result;
import io.minio.messages.Item;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com._look.api.entities.Listing;
import com._look.api.DTO.ListingUpdateDTO;
import com._look.api.repositories.ListingRepository;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private MinioClient minioClient;

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

    @Test
    void getListingByIdShouldIncreaseViewCountWhenListingExists() {
        Listing listing = new Listing(null, null, null, "Title", null, null, null, 4, null, null, List.of());
        when(listingRepository.findById(42)).thenReturn(Optional.of(listing));
        when(listingRepository.save(listing)).thenReturn(listing);

        Optional<Listing> result = listingService.getListingById(42);

        assertTrue(result.isPresent());
        assertEquals(5, result.get().getViewCount());
        verify(listingRepository).findById(42);
        verify(listingRepository).save(listing);
    }

    @Test
    void deleteAllUserListingsShouldRemoveListingImagesFromMinio() {
        ReflectionTestUtils.setField(listingService, "bucket", "listing-bucket");
        ReflectionTestUtils.setField(listingService, "minioClient", minioClient);

        Listing listing = new Listing(7, 11, null, "Title", null, null, null, null, null, null, List.of());
        Item firstItem = mock(Item.class);
        Item secondItem = mock(Item.class);

        when(listingRepository.findAllBySellerId(11)).thenReturn(List.of(listing));
        when(firstItem.objectName()).thenReturn("7/first.jpg");
        when(secondItem.objectName()).thenReturn("7/second.jpg");
        when(minioClient.listObjects(any(ListObjectsArgs.class)))
            .thenReturn(List.of(new Result<>(firstItem), new Result<>(secondItem)));
        when(minioClient.removeObjects(any(RemoveObjectsArgs.class))).thenReturn(List.of());

        listingService.deleteAllUserListings(11);

        ArgumentCaptor<RemoveObjectsArgs> removeArgsCaptor = ArgumentCaptor.forClass(RemoveObjectsArgs.class);
        verify(minioClient).removeObjects(removeArgsCaptor.capture());
        verify(listingRepository).delete(listing);

        List<String> objectNames = StreamSupport.stream(removeArgsCaptor.getValue().objects().spliterator(), false)
            .map(object -> (String) ReflectionTestUtils.getField(object, "name"))
            .toList();

        assertEquals(List.of("7/first.jpg", "7/second.jpg"), objectNames);
    }

    @Test
    void deleteListingShouldThrowWhenListingDoesNotExist() {
        when(listingRepository.findById(7)).thenReturn(Optional.empty());

        NoSuchElementException exception = assertThrows(
            NoSuchElementException.class,
            () -> listingService.deleteListing(7)
        );

        assertEquals("Listing not found", exception.getMessage());
        verify(minioClient, never()).listObjects(any(ListObjectsArgs.class));
        verify(listingRepository, never()).delete(any(Listing.class));
    }

    @Test
    void editListingShouldDeleteImagesMissingFromDtoImageUrls() {
        ReflectionTestUtils.setField(listingService, "bucket", "listing-bucket");
        ReflectionTestUtils.setField(listingService, "minioEndpoint", "http://minio:9000");
        ReflectionTestUtils.setField(listingService, "publicMinioEndpoint", "http://localhost:9000");
        ReflectionTestUtils.setField(listingService, "minioClient", minioClient);

        Listing listing = new Listing(
            7,
            11,
            null,
            "Title",
            null,
            12.0,
            "Place",
            null,
            null,
            null,
            List.of(
                "http://localhost:9000/listing-bucket/7/keep.jpg",
                "http://localhost:9000/listing-bucket/7/delete.jpg"
            )
        );
        ListingUpdateDTO dto = new ListingUpdateDTO();
        dto.setImage_urls(List.of("http://localhost:9000/listing-bucket/7/keep.jpg"));
        Item keepItem = mock(Item.class);
        Item deleteItem = mock(Item.class);

        when(listingRepository.findById(7)).thenReturn(Optional.of(listing));
        when(listingRepository.save(listing)).thenReturn(listing);
        when(keepItem.objectName()).thenReturn("7/keep.jpg");
        when(deleteItem.objectName()).thenReturn("7/delete.jpg");
        when(minioClient.listObjects(any(ListObjectsArgs.class)))
            .thenReturn(List.of(new Result<>(keepItem), new Result<>(deleteItem)));
        when(minioClient.removeObjects(any(RemoveObjectsArgs.class))).thenReturn(List.of());

        Listing updatedListing = listingService.editListing(7, 11, dto, null);

        ArgumentCaptor<RemoveObjectsArgs> removeArgsCaptor = ArgumentCaptor.forClass(RemoveObjectsArgs.class);
        verify(minioClient).removeObjects(removeArgsCaptor.capture());
        verify(listingRepository).save(listing);

        List<String> objectNames = StreamSupport.stream(removeArgsCaptor.getValue().objects().spliterator(), false)
            .map(object -> (String) ReflectionTestUtils.getField(object, "name"))
            .toList();

        assertEquals(List.of("7/delete.jpg"), objectNames);
        assertEquals(List.of("http://localhost:9000/listing-bucket/7/keep.jpg"), updatedListing.getImages());
    }
}
