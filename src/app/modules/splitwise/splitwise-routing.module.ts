import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SplitwiseComponent } from './splitwise.component';
import { GroupDetailsComponent } from './group-details/group-details.component';
import { MembersPageComponent } from './members-page/members-page.component';

const routes: Routes = [
  {
    path: '',
    component: SplitwiseComponent
  },
  {
    path: 'group/:id',
    component: GroupDetailsComponent
  },
  {
    path: 'members/:id',
    component: MembersPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SplitwiseRoutingModule { } 