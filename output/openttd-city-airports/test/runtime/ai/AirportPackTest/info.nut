class AirportPackInfo extends AIInfo {
    function GetAuthor() { return "Airport pack validation"; }
    function GetName() { return "AirportPackTest"; }
    function GetDescription() { return "Isolated four-airport build and flight test."; }
    function GetVersion() { return 1; }
    function GetDate() { return "2026-10-08"; }
    function CreateInstance() { return "AirportPackTest"; }
    function GetShortName() { return "APCK"; }
    function GetAPIVersion() { return "15"; }
}
RegisterAI(AirportPackInfo());
