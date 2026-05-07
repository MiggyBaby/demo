import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Get()
  getTasks() {
    return this.tasksService.findAll();
  }

  @Post()
  createTask(@Body() body: any) {
    return this.tasksService.create(body);
  }

  @Put(':id')
  updateTask(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tasksService.update(Number(id), body);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.tasksService.delete(Number(id));
  }
}