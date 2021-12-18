import { Cron, Injectable, Interval, Timeout } from "../../../mod.ts";
import { RoleService } from "./role.service.ts";

@Injectable()
export class ScheduleService {
  constructor(private readonly roleService: RoleService) {}

  @Timeout(2000)
  onceJob() {
    console.log("-----once---", this.roleService.info());
  }

  @Interval(5000)
  intervalJob() {
    console.log("-----interval---", this.roleService.info());
  }

  @Cron("0 */1 * * * *")
  intervalOneMinuteJob() {
    console.info(
      `【${ScheduleService.name}】one minute interval job!`,
      this.roleService.info(),
    );
  }

  @Cron("0 */2 * * * *")
  intervalTwoMinuteJob() {
    console.info(`【${ScheduleService.name}】two minute interval job!`);
  }
}
