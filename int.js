const SHEET_ID = "1hyNU5JzUzeUS82Nm-KFZlipLLhfPPaLXb31V45uqeNY";
const API_KEY = "AIzaSyCY1zguDICkwCuaL801TCMTagMhCF0gF5o";
const RANGE = "Sheet1"; // Assuming the sheet name is "Sheet1". Update if different.

const fetchSheetData = async () => {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );
        const data = await response.json();
        return data.values;
    } catch (error) {
        console.error("Error fetching data from Google Sheets:", error);
    }
};

const renderSummary = async () => {
    const container = document.getElementById("expense-container");
    const sheetData = await fetchSheetData();

    if (!sheetData || sheetData.length < 2) {
        container.innerHTML = "<p>No data found.</p>";
        return;
    }

    // Extract headers and rows
    const [headers, ...rows] = sheetData;

    // Process data into months and years, filtering for "interest"
    const expenseData = {};
    const yearlyTotal = {};

    rows.forEach((row, index) => {
        const [timestamp, spentOn, amount, reason] = row;

        // Filter rows where reason is "interest" (case-sensitive exact match)
        if (!reason || reason.trim() !== "interest") {
            return;
        }

        if (!timestamp || !spentOn || !amount) {
            console.warn(`Skipping invalid row at index ${index}:`, row);
            return;
        }

        // Parse the timestamp (handle MM/DD/YYYY HH:mm:ss format)
        const [date, time] = timestamp.split(" ");
        const [month, day, year] = date.split("/").map(Number);

        if (!year || !month || !day) {
            console.warn("Invalid date format in timestamp:", timestamp);
            return;
        }

        const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
        const entryDate = new Date(`${year}-${month}-${day}T${time}`);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            console.warn(`Skipping row with invalid amount at index ${index}:`, row);
            return;
        }

        // Calculate total per month
        if (!expenseData[year]) {
            expenseData[year] = {};
        }

        if (!expenseData[year][monthKey]) {
            expenseData[year][monthKey] = 0;
        }
        expenseData[year][monthKey] += parsedAmount;

        // Calculate total per year
        if (!yearlyTotal[year]) {
            yearlyTotal[year] = 0;
        }
        yearlyTotal[year] += parsedAmount;
    });

    // Sort years in descending order to display the latest years first
    const sortedYears = Object.keys(expenseData).sort((a, b) => b - a);

    // Clear container before rendering
    container.innerHTML = "";

    // Create the content for each year
    sortedYears.forEach(year => {
        const yearData = expenseData[year];

        // Create a box for each year
        const yearBox = document.createElement("div");
        yearBox.className = "year-box";

        const yearHeader = document.createElement("h2");
        yearHeader.textContent = `Total  ${year} (interest) - ₹${yearlyTotal[year].toFixed(2)}`;
        yearBox.appendChild(yearHeader);

        // Create a table for the months in the current year
        const table = document.createElement("table");
        table.className = "expense-table";

        // Create table headers
        const tableHeader = `
            <tr>
                <th>Month</th>
                <th>Total Spend</th>
            </tr>`;
        table.innerHTML = tableHeader;

        // Insert month-wise data
        Object.keys(yearData)
            .sort()
            .forEach(monthKey => {
                const totalAmount = yearData[monthKey];
                const [year, monthNumber] = monthKey.split("-");

                // Convert month number to month name
                const monthName = new Date(`${year}-${monthNumber}-01`).toLocaleString("default", { month: "long" });

                const row = `
                    <tr>
                        <td>${monthName} ${year}</td>
                        <td>₹${totalAmount.toFixed(2)}</td>
                    </tr>`;
                table.innerHTML += row;
            });

        yearBox.appendChild(table);
        container.appendChild(yearBox);
    });
};

renderSummary();
