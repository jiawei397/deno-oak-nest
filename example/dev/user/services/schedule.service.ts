import { assert, Injectable } from "@nest";
import { RoleService } from "./role.service.ts";
import { Cron, Interval, Timeout } from "../../../../modules/schedule/mod.ts";

@Injectable()
export class ScheduleService {
  constructor(private readonly roleService: RoleService) {}

  @Timeout(2000)
  onceJob() {
    assert(this.roleService, "roleService is not defined");
    console.log("-----once---", this.roleService.info());
  }

  @Interval(5000)
  async intervalJob() {
    assert(this.roleService, "roleService is not defined");
    console.log("-----interval---", await this.roleService.info());
  }

  @Cron("0 */1 * * * *")
  intervalOneMinuteJob() {
    assert(this.roleService, "roleService is not defined");
    console.info(
      `【${ScheduleService.name}】one minute interval job!`,
    );
  }

  @Cron("0 */2 * * * *")
  intervalTwoMinuteJob() {
    console.info(`【${ScheduleService.name}】two minute interval job!`);
  }
}
