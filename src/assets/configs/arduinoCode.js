const esp32Imports = `
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Arduino_JSON.h>   //https://github.com/arduino-libraries/Arduino_JSON
#include <Preferences.h>    //https://github.com/vshymanskyy/Preferences
`

const esp32Code = `

// Add your WiFi credentials
char ssid[] = "YOUR_SSID";
char pass[] = "YOUR_PASSWORD";

// WiFiClientSecure client for ESP32 Boards;
WiFiClientSecure *client = new WiFiClientSecure;

void setup() {

    Serial.begin(115200);  //If Required for Debuging
    preferences.begin("IOT", false);

};
    
void loop(){
    // Void Loop Section
};

`;

const esp8266Imports = `
#include <WiFi.h>

#include <Arduino_JSON.h>   //https://github.com/arduino-libraries/Arduino_JSON
#include <Preferences.h>    //https://github.com/vshymanskyy/Preferences
`


const esp8266Code = `

// Add your WiFi credentials
char ssid[] = "YOUR_SSID";
char pass[] = "YOUR_PASSWORD";

// WiFiClientSecure client for ESP32 Boards;
WiFiClientSecure *client = new WiFiClientSecure;

void setup() {
    
    Serial.begin(115200);  //If Required for Debuging
    preferences.begin("IOT", false);

};
    
void loop(){
    // Void Loop Section
};

`;







export { esp32Imports, esp32Code, esp8266Imports, esp8266Code };