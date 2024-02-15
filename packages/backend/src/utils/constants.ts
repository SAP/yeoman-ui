import { isEmpty, get } from "lodash";
import { join } from "path";
import { homedir } from "os";

class ConstantsUtil {
  public IS_IN_BAS =
    !isEmpty(get(process, "env.WS_BASE_URL")) || get(process, "env.TENANT_PLAN") === "personal-edition";
  public HOMEDIR_PROJECTS: string = join(homedir(), "projects");
}

export const Constants = new ConstantsUtil();
