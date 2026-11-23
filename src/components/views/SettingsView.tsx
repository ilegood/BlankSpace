import React from 'react';
import { useTheme } from '../../store/ThemeContext';
import { useWorkspace } from '../../store/WorkspaceContext';
import { formatTimeClock } from '../../utils/time';
import { useToast } from '../toast/ToastContext';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const {
    autoSaveEnabled,
    setAutoSaveEnabled,
    saveStatus,
    lastSavedAt,
    retryLastSave,
    setNavSection,
  } = useWorkspace();
  const { showToast } = useToast();

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-fade">
      <div className="max-w-[920px] mx-auto flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-[24px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">설정</h1>
          <p className="mt-1 text-[13px] text-[#6E6D7A] dark:text-[#9E9CAF]">
            작업 환경과 데이터를 관리합니다.
          </p>
        </div>

        {/* 화면 */}
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">화면</h2>
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[13.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">테마</div>
              <div className="text-xs text-[#8A8998] mt-0.5">
                라이트 모드와 다크 모드 중에서 고릅니다.
              </div>
            </div>
            <div className="inline-flex rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5 bg-white dark:bg-[#15151C]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-[#1B1B1F] text-white'
                    : 'text-[#6E6D7A] dark:text-[#9E9CAF]'
                }`}
              >
                라이트
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-[#F1F0F6] text-[#15151C]'
                    : 'text-[#6E6D7A] dark:text-[#9E9CAF]'
                }`}
              >
                다크
              </button>
            </div>
          </div>
        </section>

        {/* 저장 (§2-6 글씨와 색으로 상태 표시) */}
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">저장</h2>
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  자동 저장
                </div>
                <div className="text-xs text-[#8A8998] mt-0.5">
                  변경한 내용을 자동으로 저장합니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  autoSaveEnabled ? 'bg-[#6A5ACD]' : 'bg-[#DCD8EC] dark:bg-[#323244]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    autoSaveEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  저장 상태
                </div>
                <div className="text-xs text-[#8A8998] mt-0.5">
                  {lastSavedAt ? `마지막으로 저장된 시각 · ${formatTimeClock(lastSavedAt)}` : '대기 중'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    saveStatus === 'saving'
                      ? 'text-[#8A8998]'
                      : saveStatus === 'error'
                        ? 'text-rose-600'
                        : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {saveStatus === 'saving'
                    ? '저장 중…'
                    : saveStatus === 'error'
                      ? '저장 실패'
                      : '저장됨'}
                </span>
                {saveStatus === 'error' && (
                  <button
                    type="button"
                    onClick={retryLastSave}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-semibold"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 백업 및 복원 (구현 전 "준비 중" 표시 §3-7) */}
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">백업 및 복원</h2>
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  데이터 백업
                </div>
                <div className="text-xs text-[#8A8998] mt-0.5">
                  프로젝트, 문서, 파일을 백업합니다.
                </div>
              </div>
              <button
                type="button"
                title="준비 중"
                onClick={() => showToast('백업 기능은 준비 중입니다')}
                className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] opacity-75"
              >
                준비 중
              </button>
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[13.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  백업에서 복원
                </div>
                <div className="text-xs text-[#8A8998] mt-0.5">
                  이전에 만든 백업으로 되돌립니다.
                </div>
              </div>
              <button
                type="button"
                title="준비 중"
                onClick={() => showToast('복원 기능은 준비 중입니다')}
                className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] opacity-75"
              >
                준비 중
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">도움말</h2>
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[13.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">
                도움말 보기
              </div>
              <div className="text-xs text-[#8A8998] mt-0.5">
                기능별 사용 방법을 확인합니다.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNavSection('help')}
              className="px-4 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#6A5ACD]"
            >
              열기
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
