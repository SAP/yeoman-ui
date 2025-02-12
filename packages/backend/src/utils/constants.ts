import { isEmpty, get } from "lodash";
import { join } from "path";
import { homedir } from "os";
import { devspace } from "@sap/bas-sdk";

export function isURL(optionalUri: string): boolean {
  try {
    const optionalUriObj = JSON.parse(optionalUri);
    return "name" in optionalUriObj && "uri" in optionalUriObj;
  } catch {
    return false;
  }
}

class ConstantsUtil {
  public IS_IN_BAS = !isEmpty(get(process, "env.WS_BASE_URL")) || devspace.getBasMode() === "personal-edition";
  public HOMEDIR_PROJECTS: string = join(homedir(), "projects");
  public GENERATOR_COMPLETED: string = "generatorCompleted";
}

export const Constants = new ConstantsUtil();
