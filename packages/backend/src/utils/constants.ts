import { isEmpty, get } from "lodash";
import { join } from "path";
import { homedir } from "os";
import { devspace } from "@sap/bas-sdk";

class ConstantsUtil {
  public IS_IN_BAS = !isEmpty(get(process, "env.WS_BASE_URL")) || devspace.getBasMode() === "personal-edition";
  public HOMEDIR_PROJECTS: string = join(homedir(), "projects");
}

export const Constants = new ConstantsUtil();
