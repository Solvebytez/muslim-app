import FilterCuisines from "@/screen/Cuisins/FilterCuisines";
import React from "react";

const Cuisines = () => {
  // Allow guest access to cuisines - users can browse without login
  // Some features may require login, but browsing is allowed
  return <FilterCuisines />;
};

export default Cuisines;
