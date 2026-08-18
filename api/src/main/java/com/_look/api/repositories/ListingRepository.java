package com._look.api.repositories;

import com._look.api.entities.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Integer>, JpaSpecificationExecutor<Listing> 
{
@Query("select listing from Listing listing where listing.seller_id = :sellerId")
public List<Listing> findAllBySellerId(@Param("sellerId") Integer sellerId);


}
