// src/users/users.controller.ts
import { Controller, Patch, Body, Param, ParseIntPipe, Req } from '@nestjs/common';
import { SettingsService } from '../service/settings.service';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import type { Request } from 'express';

@Controller('settings')
export class UsersSettingsController {
  constructor(private usersService: SettingsService) {}

  @Patch('account/:id')
  async updateSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AccountSettingsDto,
    @Req() request: Request,
  ) {
    console.log(request);
    return this.usersService.updateUserSettings(id, dto);
  }
}