import type { Scenario } from '@/Types/Scenario';

export function downloadScenario(scenario: Scenario, handleClose: () => void) {
    try {
        // Get the scenario data as JSON
        const jsonString = scenario.toJson();

        // Create a blob with the JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = scenario.name ? `${scenario.name}.json` : `scenario-${new Date().toISOString().split('T')[0]}.json`;

        // Append to the document, click to download, then remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Release the URL object
        URL.revokeObjectURL(url);

        // Close the menu
        handleClose();
    } catch (error) {
        console.error('Error downloading scenario:', error);
        alert('Failed to download scenario. See console for details.');
    }
}