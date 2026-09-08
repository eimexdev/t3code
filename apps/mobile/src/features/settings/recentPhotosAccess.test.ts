import { beforeEach, expect, it, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({ get: vi.fn(), request: vi.fn() }));
vi.mock("expo-image-picker", () => ({
  getMediaLibraryPermissionsAsync: mocks.get,
  requestMediaLibraryPermissionsAsync: mocks.request,
}));
import { requestRecentPhotosAccess } from "./recentPhotosAccess";

beforeEach(() => vi.resetAllMocks());

it.each([true, false])(
  "returns the user's first permission decision: granted=%s",
  async (granted) => {
    mocks.get.mockResolvedValue({ granted: false, canAskAgain: true });
    const decision = { granted, canAskAgain: false };
    mocks.request.mockResolvedValue(decision);
    expect(await requestRecentPhotosAccess()).toEqual(decision);
    expect(mocks.request).toHaveBeenCalledTimes(1);
  },
);

it.each([
  { granted: false, canAskAgain: false, accessPrivileges: "none" },
  { granted: true, canAskAgain: true, accessPrivileges: "limited" },
  { granted: true, canAskAgain: true, accessPrivileges: "all" },
])("does not prompt again for $accessPrivileges access", async (access) => {
  mocks.get.mockResolvedValue(access);
  expect(await requestRecentPhotosAccess()).toEqual(access);
  expect(mocks.request).not.toHaveBeenCalled();
});
