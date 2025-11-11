// Ambient module declarations for internal packages lacking type definitions under ESM migration
// Allow importing internal types package without published typings in consumer package.
declare module "@sap-devx/yeoman-ui-types" {
  export class AppWizard {
    // Add minimal class for AppWizard 
    [key: string]: any;
  }
  
  export interface IPrompt {
    name?: string;
    description?: string;
    questions?: any[];
    [key: string]: any;
  }
  
  export interface IBannerProps {
    [key: string]: any;
  }
  
  export enum Severity {
    error = "error",
    warning = "warning", 
    information = "information"
  }
  
  export enum MessageType {
    prompt = "prompt",
    notification = "notification"
  }
}