// Log when the content script is loaded
console.log("Real Estate Price Calculator content script loaded.");

// Debounce function to limit the frequency of updates
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Function to format numbers in German format
function formatGermanCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

// Function to parse square meters correctly (converting comma to dot for decimals)
function parseSquareMeters(sqMetersText) {
  return parseFloat(
    sqMetersText
      .replace(".", "")
      .replace(",", ".")
      .replace(/[^0-9.]/g, "")
  );
}

// Function to calculate and update overlays
function updateOverlays(interestRate, clearanceRate, factor) {
  // Select all the house listings
  const listings = document.querySelectorAll(".result-list__listing");
  console.log(
    "Updating overlays for listings. Number of listings found: ",
    listings.length
  );

  listings.forEach((listing, index) => {
    console.log(`Processing listing ${index + 1}`);

    // Find the element containing the price (specific to "Kaufpreis")
    const priceElement = Array.from(listing.querySelectorAll("dl")).find(
      (dl) => {
        const label = dl.querySelector("dt");
        return label && label.innerText.trim() === "Kaufpreis";
      }
    );

    // Find the element containing the square meters (specific to "Wohnfläche")
    const squareMetersElement = Array.from(listing.querySelectorAll("dl")).find(
      (dl) => {
        const label = dl.querySelector("dt");
        return label && label.innerText.trim() === "Wohnfläche";
      }
    );

    if (priceElement && squareMetersElement) {
      console.log(
        "Price and square meters elements found for listing ",
        index + 1
      );

      // Extract the price text and clean out non-numeric characters
      const priceText = priceElement.querySelector("dd").innerText;
      console.log("Price text: ", priceText);

      const price = parseFloat(priceText.replace(/[^0-9]/g, ""));
      console.log("Parsed price: ", price);

      // Parse the square meters correctly (e.g., converting "119,88 m²" to "119.88")
      const squareMetersText =
        squareMetersElement.querySelector("dd").innerText;
      const squareMeters = parseSquareMeters(squareMetersText);
      console.log("Parsed square meters: ", squareMeters);

      // Calculate price/20/12 (with adjustable factor)
      const calculatedPrice = (price / factor / 12).toFixed(2);

      // Calculate price per square meter
      const pricePerSquareMeter = (price / squareMeters).toFixed(2);

      console.log(
        `Calculated price for listing ${index + 1}: ${calculatedPrice} €`
      );
      console.log(
        `Price per square meter for listing ${
          index + 1
        }: ${pricePerSquareMeter} €/m²`
      );

      // Calculate the monthly mortgage rate
      const monthlyMortgage = (
        (price * (interestRate + clearanceRate)) /
        12
      ).toFixed(2);
      console.log(
        `Monthly mortgage for listing ${index + 1}: ${monthlyMortgage} €`
      );

      // Find the slick-list container for the listing
      const slickListElement = listing.querySelector(".slick-list");

      if (slickListElement) {
        console.log("slick-list element found for listing ", index + 1);

        // Remove any previous overlays
        const existingOverlay =
          slickListElement.querySelector(".price-overlay");
        if (existingOverlay) {
          existingOverlay.remove();
        }

        // Create an overlay to display the calculated price, price per square meter, monthly mortgage, and benötigte Miete
        const priceOverlay = document.createElement("div");
        priceOverlay.classList.add("price-overlay");
        priceOverlay.style.position = "absolute";
        priceOverlay.style.top = "25px"; // 15px deeper than previously
        priceOverlay.style.left = "10px";
        priceOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Neutral background color
        priceOverlay.style.color = "white";
        priceOverlay.style.padding = "5px";
        priceOverlay.style.borderRadius = "5px";
        priceOverlay.innerText = `Benötigte Miete (Factor ${factor}): ${formatGermanCurrency(
          calculatedPrice
        )}\nPrice per m²: ${pricePerSquareMeter} €/m²\nMonthly mortgage: ${formatGermanCurrency(
          monthlyMortgage
        )}`;

        // Ensure the parent element has relative positioning
        slickListElement.style.position = "relative";
        slickListElement.appendChild(priceOverlay);
        console.log("Overlay added to slick-list for listing ", index + 1);
      } else {
        console.log("No slick-list element found for listing ", index + 1);
      }
    } else {
      console.log(
        "Price or square meters element not found for listing ",
        index + 1
      );
    }
  });
}

// Function to save values in localStorage
function saveValuesToLocalStorage(interestRate, clearanceRate, factor) {
  localStorage.setItem("interestRate", interestRate);
  localStorage.setItem("clearanceRate", clearanceRate);
  localStorage.setItem("factor", factor);
}

// Function to load values from localStorage
function loadValuesFromLocalStorage() {
  const interestRate = localStorage.getItem("interestRate") || 3.75;
  const clearanceRate = localStorage.getItem("clearanceRate") || 1;
  const factor = localStorage.getItem("factor") || 20;
  return { interestRate, clearanceRate, factor };
}

// Function to create a floating toolbar at the bottom
function createToolbar() {
  const { interestRate, clearanceRate, factor } = loadValuesFromLocalStorage();

  const toolbar = document.createElement("div");
  toolbar.style.position = "fixed";
  toolbar.style.bottom = "0"; // Move the toolbar to the bottom of the page
  toolbar.style.left = "0";
  toolbar.style.width = "100%";
  toolbar.style.backgroundColor = "#333";
  toolbar.style.color = "white";
  toolbar.style.padding = "10px";
  toolbar.style.zIndex = "9999";
  toolbar.style.display = "flex";
  toolbar.style.justifyContent = "space-between";
  toolbar.style.alignItems = "center";

  const interestRateInput = document.createElement("input");
  interestRateInput.type = "number";
  interestRateInput.value = interestRate;
  interestRateInput.style.marginRight = "10px";
  interestRateInput.style.padding = "5px";
  interestRateInput.min = 0;
  interestRateInput.max = 100;
  interestRateInput.step = 0.01;

  const clearanceRateInput = document.createElement("input");
  clearanceRateInput.type = "number";
  clearanceRateInput.value = clearanceRate;
  clearanceRateInput.style.marginRight = "10px";
  clearanceRateInput.style.padding = "5px";
  clearanceRateInput.min = 0;
  clearanceRateInput.max = 100;
  clearanceRateInput.step = 0.01;

  const factorInput = document.createElement("input");
  factorInput.type = "number";
  factorInput.value = factor;
  factorInput.style.marginRight = "10px";
  factorInput.style.padding = "5px";
  factorInput.min = 1;
  factorInput.max = 100;
  factorInput.step = 1;

  const updateButton = document.createElement("button");
  updateButton.innerText = "Update Rates";
  updateButton.style.padding = "5px 10px";

  toolbar.appendChild(document.createTextNode("Interest Rate: "));
  toolbar.appendChild(interestRateInput);
  toolbar.appendChild(document.createTextNode("Clearance Rate: "));
  toolbar.appendChild(clearanceRateInput);
  toolbar.appendChild(document.createTextNode("Factor: "));
  toolbar.appendChild(factorInput);
  toolbar.appendChild(updateButton);
  document.body.appendChild(toolbar);

  // Add event listener to update overlays when the button is clicked and save the values
  updateButton.addEventListener("click", () => {
    const interestRate = parseFloat(interestRateInput.value) / 100;
    const clearanceRate = parseFloat(clearanceRateInput.value) / 100;
    const factor = parseFloat(factorInput.value);

    saveValuesToLocalStorage(interestRate * 100, clearanceRate * 100, factor); // Save the values
    updateOverlays(interestRate, clearanceRate, factor);
  });

  // Trigger initial update with saved or default values
  updateOverlays(interestRate / 100, clearanceRate / 100, factor);
}

// Function to observe changes in the listings container and trigger updates
function observeListingsContainer() {
  const listingsContainer = document.querySelector(".result-list");
  if (listingsContainer) {
    const observer = new MutationObserver(
      debounce(() => {
        console.log("Listings container changed, updating overlays...");
        const { interestRate, clearanceRate, factor } =
          loadValuesFromLocalStorage();
        updateOverlays(interestRate / 100, clearanceRate / 100, factor);
      }, 500)
    ); // Debounce to prevent excessive updates

    observer.observe(listingsContainer, { childList: true, subtree: true });
  }
}

// Create the toolbar and observer when the page loads
window.onload = function () {
  console.log("Page fully loaded, creating toolbar and setting up observer...");
  createToolbar();
  observeListingsContainer();
};
