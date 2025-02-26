import pkg from 'lodash';
const { isEmpty, get } = pkg;
import { join } from "path";
import { homedir } from "os";
import { devspace } from "@sap/bas-sdk";

class ConstantsUtil {
  // public IS_IN_BAS = !isEmpty(get(process, "env.WS_BASE_URL")) || devspace.getBasMode() === "personal-edition"; // fix the devspace import
  public IS_IN_BAS = !isEmpty(get(process, "env.WS_BASE_URL")) // delete this and uncomment the above
  public HOMEDIR_PROJECTS: string = join(homedir(), "projects");
  public GENERATOR_COMPLETED: string = "generatorCompleted";
}

export const Constants = new ConstantsUtil();
