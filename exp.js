const SHEET_ID = "1hyNU5JzUzeUS82Nm-KFZlipLLhfPPaLXb31V45uqeNY";
const API_KEY = "AIAIzaSyD2A2pd2ASiz0Vu-uGlmW6PpbwG35yGH70";
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

const renderExpenses = async () => {
    const container = document.getElementById("expense-container");
    const sheetData = await fetchSheetData();

    if (!sheetData || sheetData.length < 2) {
        container.innerHTML = "<p>No data found.</p>";
        return;
    }

    // Extract headers and rows
    const [headers, ...rows] = sheetData;

    // Process data into months and totals
    const expenseData = {};

    rows.forEach(row => {
        const [timestamp, spentOn, amount, reason] = row;

        if (!timestamp || !spentOn || !amount) {
            console.warn("Skipping invalid row:", row);
            return; // Skip invalid rows
        }

        // Parse the timestamp (handle MM/DD/YYYY HH:mm:ss format)
        const [date, time] = timestamp.split(" ");
        const [month, day, year] = date.split("/").map(Number);

        if (!year || !month || !day) {
            console.warn("Invalid date format in timestamp:", timestamp);
            return;
        }

        // Format the date into an ISO-friendly format: YYYY-MM-DDTHH:mm:ss
        const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${time}`;

        const entryDate = new Date(formattedDate);

        // Check if the date is valid
        if (isNaN(entryDate.getTime())) {
            console.warn("Invalid Date:", formattedDate);
            return;
        }

        const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

        if (!expenseData[monthKey]) {
            expenseData[monthKey] = { total: 0, entries: [] };
        }

        expenseData[monthKey].total += parseFloat(amount) || 0;
        expenseData[monthKey].entries.push({
            timestamp: entryDate, // Store as Date object for proper sorting
            spentOn,
            amount,
            reason,
        });
    });

    // Sort months in descending order
    const sortedMonths = Object.keys(expenseData).sort((a, b) => b.localeCompare(a));

    // Render data
    sortedMonths.forEach(month => {
        const monthData = expenseData[month];
        const monthBox = document.createElement("div");
        monthBox.className = "month-box";

        const monthHeader = document.createElement("h2");
        monthHeader.textContent = `${month} - Total: ₹${monthData.total.toFixed(2)}`;
        monthBox.appendChild(monthHeader);

        const table = document.createElement("table");
        table.className = "expense-table";

        // Create table headers
        const tableHeader = `
            <tr>
                
                <th>Spent On</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Timestamp</th>
            </tr>`;
        table.innerHTML = tableHeader;

        // Sort entries by timestamp (newest first) and add rows
        monthData.entries
            .sort((a, b) => b.timestamp - a.timestamp) // Sort by Date object
            .forEach(entry => {
                const row = `
                    <tr>
                        
                        <td>${entry.spentOn}</td>
                        <td>₹${entry.amount}</td>
                        <td>${entry.reason}</td>
                        <td>${entry.timestamp.toLocaleString()}</td>
                    </tr>`;
                table.innerHTML += row;
            });

        monthBox.appendChild(table);
        container.appendChild(monthBox);
    });
};

renderExpenses();
