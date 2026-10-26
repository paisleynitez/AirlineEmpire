class CampusBuilderInfo extends AIInfo {
 function GetAuthor(){return "Campus pack";}
 function GetName(){return "CampusBuilder";}
 function GetDescription(){return "Temporary isolated save builder";}
 function GetVersion(){return 1;}
 function GetDate(){return "2026-10-08";}
 function CreateInstance(){return "CampusBuilder";}
 function GetShortName(){return "HCAB";}
 function GetAPIVersion(){return "15";}
}
RegisterAI(CampusBuilderInfo());
