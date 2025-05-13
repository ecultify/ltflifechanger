<?php
// Enable error reporting for debugging (can be removed in production)
ini_set('display_errors', 1);
error_log('Proxy request received: ' . $_SERVER['REQUEST_METHOD']);

// Default API base URL
$apiBaseUrl = 'https://apiclouduat.ltfs.com:1132/LTFSME/api';

// Get the specific endpoint from the request parameter or use default
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : 'sendPosterOtp';
$apiUrl = $apiBaseUrl . '/' . $endpoint;

error_log('Proxying to: ' . $apiUrl);

// Get the request method and body
$method = $_SERVER['REQUEST_METHOD'];
$requestBody = file_get_contents('php://input');

error_log('Request method: ' . $method);
error_log('Request body: ' . substr($requestBody, 0, 200)); // Log first 200 chars for safety

// Initialize cURL
$ch = curl_init($apiUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Consider removing in production for better security

// Set request body for POST/PUT
if ($method === 'POST' || $method === 'PUT') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

// Forward relevant headers
$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if ($name !== 'Host' && $name !== 'Origin' && $name !== 'Referer') {
            $headers[] = "$name: $value";
        }
    }
} else {
    // Fallback if getallheaders isn't available
    $headers[] = "Content-Type: application/json";
}

// Ensure Content-Type is set
$contentTypeFound = false;
foreach ($headers as $header) {
    if (stripos($header, 'Content-Type:') === 0) {
        $contentTypeFound = true;
        break;
    }
}

if (!$contentTypeFound) {
    $headers[] = "Content-Type: application/json";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute request
$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

if ($error) {
    error_log('cURL Error: ' . $error);
}

error_log('Response code: ' . $httpCode);
error_log('Response content type: ' . $contentType);
error_log('Response body: ' . substr($response, 0, 200)); // Log first 200 chars for safety

curl_close($ch);

// Set response headers
http_response_code($httpCode);

// Set Content-Type if available
if (!empty($contentType)) {
    header("Content-Type: $contentType");
} else {
    header("Content-Type: application/json");
}

// Set CORS headers to allow all - this is your server responding, not the API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($method === 'OPTIONS') {
    exit(0);
}

// Return the response
echo $response;
