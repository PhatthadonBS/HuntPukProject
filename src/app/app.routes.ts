import { Routes } from '@angular/router';
import { adminGuard, authGuard, ownerGuard, userOrAdminGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'edit-profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/edit-profile/edit-profile.page').then(
        (m) => m.EditProfilePage
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'dorm-detail/:id',
    loadComponent: () => import('./pages/dorm-detail/dorm-detail.page').then( m => m.DormDetailPage)
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./pages/compare/compare.page').then((m) => m.ComparePage),
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/favorites/favorites.page').then((m) => m.FavoritesPage),
  },
  {
    path: 'my-dorms',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/owner/my-dorms/my-dorms.page').then((m) => m.MyDormsPage),
  },
  {
    path: 'dorm-form',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/owner/dorm-form/dorm-form.page').then(
        (m) => m.DormFormPage
      ),
  },
  {
    path: 'dorm-form/:id',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/owner/dorm-form/dorm-form.page').then(
        (m) => m.DormFormPage
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage
      ),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./pages/list/list.page').then((m) => m.ListPage),
  },
  {
    path: 'manage-dorm',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/manage-dorm/manage-dorm.page').then(
        (m) => m.ManageDormPage
      ),
  },
  {
    path: 'manage-users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/manage-users/manage-users.page').then(
        (m) => m.ManageUsersPage
      ),
  },
  {
    path: 'requests',
    canActivate: [userOrAdminGuard],
    loadComponent: () =>
      import('./pages/requests/requests.page').then((m) => m.RequestsPage),
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'my-account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-account/my-account.page').then((m) => m.MyAccountPage),
  },
  {
    path: 'my-account/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-account/my-account.page').then((m) => m.MyAccountPage),
  },
  {
    path: 'recover-account',
    loadComponent: () =>
      import('./pages/recover-account/recover-account.page').then(
        (m) => m.RecoverAccountPage
      ),
  },
  {
    path: 'manage-requests-dorm-owner',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './pages/manage-requests-dorm-owner/manage-requests-dorm-owner.page'
      ).then((m) => m.ManageRequestsDormOwnerPage),
  },
  {
    path: 'manage-requests-createdorm',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './pages/manage-requests-createdorm/manage-requests-createdorm.page'
      ).then((m) => m.ManageRequestsCreatedormPage),
  },
  {
    path: 'manage-reviews/:id',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/manage-reviews/manage-reviews.page').then(
        (m) => m.ManageReviewsPage
      ),
  },
  {
    path: 'dorm-popular',
    loadComponent: () =>
      import('./pages/dorm-popular/dorm-popular.page').then(
        (m) => m.DormPopularPage
      ),
  },
  {
    path: 'edit-dorm/:id',
    canActivate: [ownerGuard],
    loadComponent: () => import('./pages/edit-dorm/edit-dorm.page').then( m => m.EditDormPage)
  },
  {
    path: 'dorm-preview/:id',
    canActivate: [ownerGuard],
    loadComponent: () => import('./pages/owner/dorm-form/dorm-form.page').then( m => m.DormFormPage)
  },
  {
    path: 'facility-management',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/facility-management/facility-management.page').then( m => m.FacilityManagementPage)
  },
  {
    path: 'type-management',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/type-management/type-management.page').then( m => m.TypeManagementPage)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then( m => m.NotFoundPage)
  }
];
