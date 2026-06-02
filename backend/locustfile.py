import random
from locust import HttpUser, task, between


class BurnoutZeroLoadTester(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        self.username = f"user_{random.randint(1, 1000)}"
        self.password = "password123"
        self.token = None
        self.role = random.choice(["employee", "manager"])

        self.login()

    def login(self):
        with self.client.post(
            "/api/auth/login/",
            json={"username": self.username, "password": self.password},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self.token = response.json().get("access")
            elif response.status_code == 401 or response.status_code == 404:
                self.client.post(
                    "/api/auth/register/",
                    json={
                        "username": self.username,
                        "email": f"{self.username}@test.com",
                        "password": self.password,
                        "first_name": "Test",
                        "last_name": "User",
                        "role": "funcionario" if self.role == "employee" else "gestor"
                    }
                )
                retry_resp = self.client.post(
                    "/api/auth/login/",
                    json={"username": self.username, "password": self.password}
                )
                if retry_resp.status_code == 200:
                    self.token = retry_resp.json().get("access")

    @property
    def headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(3)
    def view_profile(self):
        """Simulate viewing the profile dashboard."""
        self.client.get("/api/users/me/", headers=self.headers)

    @task(2)
    def check_points(self):
        """Simulate checking gamification points."""
        if self.role == "employee":
            self.client.get("/api/gamification/my-points/", headers=self.headers)

    @task(1)
    def submit_assessment(self):
        """Simulate submitting a stress/burnout assessment."""
        if self.role == "employee":
            self.client.post(
                "/api/assessments/",
                json={
                    "stress": random.randint(10, 90),
                    "anxiety": random.randint(10, 90),
                    "burnout": random.randint(10, 90),
                    "depression": random.randint(10, 90),
                },
                headers=self.headers
            )

    @task(2)
    def view_manager_overview(self):
        """Simulate manager viewing the team overview indicator dashboard."""
        if self.role == "manager":
            self.client.get("/api/manager/team-overview/", headers=self.headers)
