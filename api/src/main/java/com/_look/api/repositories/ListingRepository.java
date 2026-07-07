package com._look.api.repositories;

import com._look.api.entities.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ListingRepository extends JpaRepository<Listing, Integer>, JpaSpecificationExecutor<Listing> 
{


}
