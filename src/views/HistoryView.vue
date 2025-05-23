<template>
  <div class="history-page-container">
    <el-card shadow="lg" class="history-card">
      <template #header>
        <div class="card-header-flex">
          <div class="card-header-title">
            <el-icon><Clock /></el-icon>
            <span>我的面试历史</span>
          </div>
          <el-button
              type="danger"
              :icon="Delete"
              @click="confirmClearAllHistory"
              :disabled="historyRecords.length === 0"
              plain
              round
          >
            清空所有记录
          </el-button>
        </div>
      </template>

      <el-table
          :data="paginatedHistoryRecords"
          style="width: 100%"
          stripe
          empty-text="暂无面试历史记录"
          v-loading="loading"
          :default-sort="{ prop: 'interviewDate', order: 'descending' }"
          max-height="calc(100vh - 300px)"
      >
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="expectedPosition" label="面试岗位" sortable min-width="180">
          <template #default="scope">
            <el-tag effect="dark" round>{{ scope.row.expectedPosition || '未指定岗位' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="interviewDate" label="面试日期" sortable min-width="180" align="center">
          <template #default="scope">
            {{ formatDisplayDate(scope.row.interviewDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="overallScore" label="综合评分" sortable width="120" align="center">
          <template #default="scope">
            <el-tag :type="getScoreTagType(scope.row.overallScore)" effect="light" round>
              {{ scope.row.overallScore }} 分
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button
                size="small"
                type="primary"
                :icon="View"
                @click="viewRecordDetails(scope.row)"
                text
                bg
            >
              查看详情
            </el-button>
            <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="confirmDeleteRecord(scope.row.id)"
                text
                bg
                style="margin-left: 5px;"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="您还没有面试记录哦，快去开始一次面试吧！">
            <el-button type="primary" @click="$router.push('/')" :icon="Position">开始面试</el-button>
          </el-empty>
        </template>
      </el-table>

      <el-pagination
          v-if="historyRecords.length > pageSize"
          layout="prev, pager, next, jumper, ->, total"
          :total="historyRecords.length"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
          class="history-pagination"
          background
      />
    </el-card>

    <el-dialog
        v-model="detailsDialogVisible"
        title="面试总结详情"
        width="70%"
        top="5vh"
        draggable
        destroy-on-close
        custom-class="details-dialog"
    >
      <div v-if="selectedRecord" class="record-details-content">
        <el-descriptions :column="2" border size="large">
          <el-descriptions-item label="面试岗位" label-align="right" align="left">
            <el-tag effect="dark" round size="large">{{ selectedRecord.expectedPosition || '未指定' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="面试用户" label-align="right" align="left">{{ selectedRecord.userName || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="面试日期" label-align="right" align="left">{{ formatDisplayDate(selectedRecord.interviewDate, true) }}</el-descriptions-item>
          <el-descriptions-item label="面试用时" label-align="right" align="left">{{ selectedRecord.totalTime || 0 }} 分钟</el-descriptions-item>

          <el-descriptions-item label="综合评分" label-align="right" align="left">
            <el-tag :type="getScoreTagType(selectedRecord.overallScore)" size="large" effect="light" round>
              {{ selectedRecord.overallScore }} / 100
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="回答完整度" label-align="right" align="left">
            <el-progress :percentage="selectedRecord.completionRate || 0" :color="getScoreTagType(selectedRecord.completionRate, true)" style="width: 150px;" />
          </el-descriptions-item>
          <el-descriptions-item label="沟通表达力" label-align="right" align="left">
            <el-progress :percentage="selectedRecord.communicationSkill || 0" :color="getScoreTagType(selectedRecord.communicationSkill, true)" style="width: 150px;" />
          </el-descriptions-item>
          <el-descriptions-item label="技术能力" label-align="right" align="left">
            <el-progress :percentage="selectedRecord.codingAbility || 0" :color="getScoreTagType(selectedRecord.codingAbility, true)" style="width: 150px;" />
          </el-descriptions-item>

        </el-descriptions>

        <el-divider content-position="left"><el-icon><ChatDotRound /></el-icon> AI建议</el-divider>
        <div class="suggestion-text">
          <p>{{ selectedRecord.suggestion || '暂无AI建议。' }}</p>
        </div>

        <div v-if="selectedRecord.selectedInterviewTags && selectedRecord.selectedInterviewTags.length > 0">
          <el-divider content-position="left"><el-icon><PriceTag /></el-icon> 本次面试侧重技术点</el-divider>
          <div class="focused-tags">
            <el-tag
                v-for="tag in selectedRecord.selectedInterviewTags"
                :key="tag"
                type="info"
                effect="plain"
                round
                size="default"
                style="margin-right: 8px; margin-bottom: 8px;"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailsDialogVisible = false" :icon="Close">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Clock, Delete, View, Position, Close, ChatDotRound, PriceTag } from '@element-plus/icons-vue';
import {useRouter} from "vue-router";


const store = useStore();
const loading = ref(false); // 可以用于未来从API加载数据
const detailsDialogVisible = ref(false);
const selectedRecord = ref(null);
// eslint-disable-next-line no-unused-vars
const router = useRouter();
const pageSize = ref(10); // 每页显示条数
const currentPage = ref(1);

// 从 Vuex 获取原始历史记录
const historyRecords = computed(() => store.getters.getInterviewHistory);

// 计算当前页应显示的记录
const paginatedHistoryRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return historyRecords.value.slice(start, end);
});

const handlePageChange = (page) => {
  currentPage.value = page;
};

const formatDisplayDate = (isoDateString, showTime = false) => {
  if (!isoDateString) return 'N/A';
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (showTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  return `${year}-${month}-${day}`;
};

const getScoreTagType = (score, forProgress = false) => {
  if (score >= 90) return forProgress ? '#67C23A' : 'success';
  if (score >= 75) return forProgress ? '#409EFF' : 'primary';
  if (score >= 60) return forProgress ? '#E6A23C' : 'warning';
  return forProgress ? '#F56C6C' : 'danger';
};

const viewRecordDetails = (record) => {
  selectedRecord.value = record;
  detailsDialogVisible.value = true;
};

const confirmDeleteRecord = (recordId) => {
  ElMessageBox.confirm(
      '确定要永久删除这条面试历史记录吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error', // 使用 error 类型以示警告
        draggable: true,
      }
  ).then(() => {
    store.dispatch('deleteHistoryItem', recordId);
  }).catch(() => {
    // ElMessage.info('已取消删除。'); // 用户取消通常不需要提示
  });
};

const confirmClearAllHistory = () => {
  if (historyRecords.value.length === 0) {
    ElMessage.info('当前没有历史记录可以清空。');
    return;
  }
  ElMessageBox.confirm(
      '确定要永久删除所有面试历史记录吗？此操作不可恢复。',
      '清空所有记录确认',
      {
        confirmButtonText: '全部删除',
        cancelButtonText: '取消',
        type: 'error',
        draggable: true,
      }
  ).then(() => {
    store.dispatch('clearAllHistory');
    currentPage.value = 1; // 清空后回到第一页
  }).catch(() => {
    // ElMessage.info('已取消清空操作。');
  });
};

onMounted(() => {
  // 如果需要从后端加载历史记录，可以在这里触发一个action
  // loading.value = true;
  // store.dispatch('fetchInterviewHistory').finally(() => loading.value = false);
});

</script>

<style scoped>
.history-page-container {
  padding: 24px;
  background-color: var(--el-bg-color-page);
}

.history-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-lighter);
}
.history-card:hover {
  box-shadow: var(--el-box-shadow-light);
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-header-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.card-header-title .el-icon {
  margin-right: 8px;
  font-size: 1.3rem;
}

.el-table {
  border-radius: 8px; /* 给表格一个圆角 */
  overflow: hidden; /* 配合圆角 */
}
.el-table :deep(th.el-table__cell) {
  background-color: var(--el-fill-color-lighter) !important;
  color: var(--el-text-color-primary);
  font-weight: 500;
}
.el-table :deep(td.el-table__cell) {
  padding: 10px 0; /* 调整单元格内边距 */
}

.history-pagination {
  margin-top: 24px;
  justify-content: flex-end; /* 分页器靠右 */
}

.details-dialog :deep(.el-dialog__body) {
  padding: 20px 25px;
  max-height: 75vh; /* 限制弹窗内容最大高度 */
  overflow-y: auto; /* 内容超出时可滚动 */
}

.record-details-content {
  font-size: 14px;
}
.record-details-content .el-descriptions {
  margin-bottom: 20px;
}
.record-details-content .el-descriptions :deep(.el-descriptions__label) {
  font-weight: bold;
  color: var(--el-text-color-secondary);
}
.record-details-content .el-divider {
  margin: 25px 0;
}
.record-details-content .el-divider .el-icon {
  margin-right: 6px;
  vertical-align: middle;
}

.suggestion-text p {
  line-height: 1.8;
  color: var(--el-text-color-regular);
  background-color: var(--el-fill-color-light);
  padding: 15px;
  border-radius: 6px;
  white-space: pre-wrap; /* 保留换行符 */
}

.focused-tags .el-tag {
  cursor: default; /* 历史记录中的标签不可点击 */
}

.el-table :deep(.el-empty__description p) {
  font-size: 1rem;
  color: var(--el-text-color-secondary);
}
</style>